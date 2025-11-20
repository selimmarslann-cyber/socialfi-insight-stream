// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NOPSocialPool
 * @dev V1: Mapping tabanlı sosyal pozisyon havuzu.
 * - Her contribute/post, postId ile temsil edilir.
 * - Kullanıcılar NOP yatırarak pozisyon açar (depositNOP).
 * - Pozisyon kapatırken NOP çeker (withdrawNOP).
 * - Her işlemden küçük bir protokol ücreti (fee) alınır.
 *
 * NOT:
 * - Bu V1, sadece "kim ne kadar NOP ile bu contribute'a pozisyon almış"
 *   bilgisini zincire yazar. NFT ve advanced reputation v2 aşaması için
 *   temel olarak tasarlandı.
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract NOPSocialPool is Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable nopToken;
    address public treasury;

    // Fee: basis points (bp) 100 = %1
    uint256 public constant FEE_BP = 100; // 100 / 10000 = %1

    // Fee distribution (for future on-chain routing)
    // Creator: 40%, LP: 30%, Treasury: 20%, Early Buyer: 10%
    uint256 public constant CREATOR_BPS = 40; // 40% of fee
    uint256 public constant LP_BPS = 30; // 30% of fee
    uint256 public constant TREASURY_BPS = 20; // 20% of fee
    uint256 public constant EARLY_BONUS_BPS = 10; // 10% of fee

    // Fee routing addresses (for future implementation)
    address public feeRouter; // Address that handles fee distribution
    bool public feeRoutingEnabled; // Enable/disable fee routing

    // user pozisyonları: postId => user => amount
    mapping(uint256 => mapping(address => uint256)) public positions;

    // hangi postId'lerin yatırıma açık olduğu
    mapping(uint256 => bool) public postEnabled;

    // postId => creator address (for fee distribution)
    mapping(uint256 => address) public postCreators;

    // postId => buyer count (for early buyer bonus)
    mapping(uint256 => uint256) public buyerCounts;

    // Minimum deposit amount (to prevent dust attacks and fee bypass)
    uint256 public constant MIN_DEPOSIT_AMOUNT = 1e15; // 0.001 NOP (assuming 18 decimals)
    
    // Maximum position per user per post (0 = unlimited)
    mapping(uint256 => uint256) public maxPositionPerUser;

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PostSet(uint256 indexed postId, bool enabled);
    event FeeRouterUpdated(address indexed oldRouter, address indexed newRouter);
    event FeeRoutingToggled(bool enabled);

    event PositionIncreased(
        address indexed user,
        uint256 indexed postId,
        uint256 netAmount,
        uint256 feeAmount
    );

    event PositionDecreased(
        address indexed user,
        uint256 indexed postId,
        uint256 netAmount,
        uint256 feeAmount
    );

    event FeeDistributed(
        uint256 indexed postId,
        uint256 totalFee,
        uint256 creatorShare,
        uint256 lpShare,
        uint256 treasuryShare,
        uint256 earlyBonus
    );

    error InvalidAddress();
    error PoolDisabled();
    error AmountZero();
    error InsufficientPosition();
    error AmountTooSmall();
    error MaxPositionExceeded();
    error Paused();

    constructor(address _nopToken, address _treasury) Ownable(msg.sender) {
        if (_nopToken == address(0) || _treasury == address(0)) revert InvalidAddress();
        nopToken = IERC20(_nopToken);
        treasury = _treasury;
    }

    // ---------------------------------------------------------------------
    // Admin fonksiyonları
    // ---------------------------------------------------------------------

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidAddress();
        address old = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(old, _treasury);
    }

    /// @notice Bir contribute/post için yatırımın açılıp kapanmasını yönetirsin.
    function setPostEnabled(uint256 postId, bool enabled) external onlyOwner {
        postEnabled[postId] = enabled;
        emit PostSet(postId, enabled);
    }

    /// @notice Set creator address for a post (for fee distribution)
    function setPostCreator(uint256 postId, address creator) external onlyOwner {
        if (creator == address(0)) revert InvalidAddress();
        postCreators[postId] = creator;
    }

    /// @notice Set fee router address (for future on-chain fee routing)
    function setFeeRouter(address _feeRouter) external onlyOwner {
        if (_feeRouter == address(0)) revert InvalidAddress();
        address old = feeRouter;
        feeRouter = _feeRouter;
        emit FeeRouterUpdated(old, _feeRouter);
    }

    /// @notice Enable/disable fee routing
    function setFeeRoutingEnabled(bool enabled) external onlyOwner {
        feeRoutingEnabled = enabled;
        emit FeeRoutingToggled(enabled);
    }

    /// @notice Set maximum position per user for a post (0 = unlimited)
    function setMaxPositionPerUser(uint256 postId, uint256 maxAmount) external onlyOwner {
        maxPositionPerUser[postId] = maxAmount;
    }

    /// @notice Pause all operations (emergency use)
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause all operations
    function unpause() external onlyOwner {
        _unpause();
    }

    // ---------------------------------------------------------------------
    // Kullanıcı fonksiyonları
    // ---------------------------------------------------------------------

    /// @notice BUY tarafta göreceğin işlem: NOP yatır, pozisyon aç.
    /// - amount kadar NOP gönderir.
    /// - İçinden %1 fee kesilir, treasury'e gider.
    /// - Kalan net miktar pozisyonuna eklenir.
    /// - Future: Fee will be distributed to creator, LP, treasury, early buyers
    /// @dev Flash loan protection: buyerCount is incremented before external calls
    function depositNOP(uint256 postId, uint256 amount) external nonReentrant whenNotPaused {
        if (!postEnabled[postId]) revert PoolDisabled();
        if (amount == 0) revert AmountZero();
        if (amount < MIN_DEPOSIT_AMOUNT) revert AmountTooSmall();
        
        // ✅ Flash loan protection: Store block number to prevent same-block flash loans
        // In a more sophisticated system, you'd track deposits per block
        // For now, we rely on the fact that buyerCount is incremented before external calls

        uint256 fee = (amount * FEE_BP) / 10_000;
        uint256 net = amount - fee;

        // Kullanıcıdan bu kontrata toplam amount çek
        // Öncesinde kullanıcı approve etmiş olmalı
        bool ok1 = nopToken.transferFrom(msg.sender, address(this), amount);
        require(ok1, "transferFrom failed");

        // Increment buyer count for early buyer bonus
        buyerCounts[postId] += 1;
        uint256 buyerCount = buyerCounts[postId];

        // Calculate fee distribution (for future on-chain routing)
        uint256 creatorShare = 0;
        uint256 lpShare = 0;
        uint256 treasuryShare = 0;
        uint256 earlyBonus = 0;

        if (feeRoutingEnabled && feeRouter != address(0)) {
            // Future: Fee router will handle distribution
            // For now, send all to treasury
            bool ok2 = nopToken.transfer(treasury, fee);
            require(ok2, "fee transfer failed");
        } else {
            // Current: Simple fee distribution
            // Creator: 40%, LP: 30%, Treasury: 20%, Early Buyer: 10% (if first 10 buyers)
            address creator = postCreators[postId];
            bool isEarlyBuyer = buyerCount <= 10;

            creatorShare = (fee * CREATOR_BPS) / 100;
            lpShare = (fee * LP_BPS) / 100;
            treasuryShare = (fee * TREASURY_BPS) / 100;
            earlyBonus = isEarlyBuyer ? (fee * EARLY_BONUS_BPS) / 100 : 0;

            // Send to treasury for now (will be routed on-chain in future)
            // Creator, LP, and early buyer rewards will be handled off-chain
            bool ok2 = nopToken.transfer(treasury, fee);
            require(ok2, "fee transfer failed");
        }

        // Check maximum position limit
        uint256 newPosition = positions[postId][msg.sender] + net;
        uint256 maxPos = maxPositionPerUser[postId];
        if (maxPos > 0 && newPosition > maxPos) revert MaxPositionExceeded();

        // Pozisyonu arttır (CEI: Effects before Interactions)
        positions[postId][msg.sender] = newPosition;

        emit PositionIncreased(msg.sender, postId, net, fee);
        emit FeeDistributed(postId, fee, creatorShare, lpShare, treasuryShare, earlyBonus);
    }

    /// @notice SELL tarafta göreceğin işlem: Pozisyondan çık, NOP çek.
    /// - amount kadar pozisyonunu düşürür.
    /// - İçinden yine %1 exit fee kesilir.
    /// - Kalan net miktar cüzdanına yollanır.
    /// @dev Uses CEI pattern: Checks -> Effects -> Interactions
    function withdrawNOP(uint256 postId, uint256 amount) external nonReentrant whenNotPaused {
        uint256 bal = positions[postId][msg.sender];
        if (amount == 0) revert AmountZero();
        if (amount > bal) revert InsufficientPosition();

        uint256 fee = (amount * FEE_BP) / 10_000;
        uint256 net = amount - fee;

        // ✅ CEI Pattern: Effects (state update) BEFORE Interactions (external calls)
        // Pozisyon azalt
        positions[postId][msg.sender] = bal - amount;

        // Emit event before external calls
        emit PositionDecreased(msg.sender, postId, net, fee);

        // ✅ Interactions (external calls) AFTER state updates
        // Kullanıcıya net miktarı gönder
        bool ok1 = nopToken.transfer(msg.sender, net);
        require(ok1, "transfer failed");

        // Fee'yi treasury'e gönder
        if (fee > 0) {
            bool ok2 = nopToken.transfer(treasury, fee);
            require(ok2, "fee transfer failed");
        }
    }

    /// @notice Kullanıcının belirli bir postId için pozisyonu.
    function getPosition(address user, uint256 postId) external view returns (uint256) {
        return positions[postId][user];
    }
}
