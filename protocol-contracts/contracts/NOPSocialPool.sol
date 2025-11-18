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

contract NOPSocialPool is Ownable {
    IERC20 public immutable nopToken;
    address public treasury;

    // Fee: basis points (bp) 100 = %1
    uint256 public constant FEE_BP = 100; // 100 / 10000 = %1

    // user pozisyonları: postId => user => amount
    mapping(uint256 => mapping(address => uint256)) public positions;

    // hangi postId'lerin yatırıma açık olduğu
    mapping(uint256 => bool) public postEnabled;

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PostSet(uint256 indexed postId, bool enabled);

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

    error InvalidAddress();
    error PoolDisabled();
    error AmountZero();
    error InsufficientPosition();

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

    // ---------------------------------------------------------------------
    // Kullanıcı fonksiyonları
    // ---------------------------------------------------------------------

    /// @notice BUY tarafta göreceğin işlem: NOP yatır, pozisyon aç.
    /// - amount kadar NOP gönderir.
    /// - İçinden %1 fee kesilir, treasury'e gider.
    /// - Kalan net miktar pozisyonuna eklenir.
    function depositNOP(uint256 postId, uint256 amount) external {
        if (!postEnabled[postId]) revert PoolDisabled();
        if (amount == 0) revert AmountZero();

        uint256 fee = (amount * FEE_BP) / 10_000;
        uint256 net = amount - fee;

        // Kullanıcıdan bu kontrata toplam amount çek
        // Öncesinde kullanıcı approve etmiş olmalı
        bool ok1 = nopToken.transferFrom(msg.sender, address(this), amount);
        require(ok1, "transferFrom failed");

        // Fee'yi treasury'e yolla
        if (fee > 0) {
            bool ok2 = nopToken.transfer(treasury, fee);
            require(ok2, "fee transfer failed");
        }

        // Pozisyonu arttır
        positions[postId][msg.sender] += net;

        emit PositionIncreased(msg.sender, postId, net, fee);
    }

    /// @notice SELL tarafta göreceğin işlem: Pozisyondan çık, NOP çek.
    /// - amount kadar pozisyonunu düşürür.
    /// - İçinden yine %1 exit fee kesilir.
    /// - Kalan net miktar cüzdanına yollanır.
    function withdrawNOP(uint256 postId, uint256 amount) external {
        uint256 bal = positions[postId][msg.sender];
        if (amount == 0) revert AmountZero();
        if (amount > bal) revert InsufficientPosition();

        uint256 fee = (amount * FEE_BP) / 10_000;
        uint256 net = amount - fee;

        // Pozisyon azalt
        positions[postId][msg.sender] = bal - amount;

        // Kullanıcıya net miktarı gönder
        bool ok1 = nopToken.transfer(msg.sender, net);
        require(ok1, "transfer failed");

        // Fee'yi treasury'e gönder
        if (fee > 0) {
            bool ok2 = nopToken.transfer(treasury, fee);
            require(ok2, "fee transfer failed");
        }

        emit PositionDecreased(msg.sender, postId, net, fee);
    }

    /// @notice Kullanıcının belirli bir postId için pozisyonu.
    function getPosition(address user, uint256 postId) external view returns (uint256) {
        return positions[postId][user];
    }
}
