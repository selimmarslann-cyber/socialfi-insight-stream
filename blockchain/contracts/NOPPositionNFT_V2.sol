// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NOPPositionNFT V2
 * @dev ERC721-based Position NFT with authorized minter support.
 * This version allows the NOPSocialPool contract to mint NFTs directly.
 * Security improvements: Gas-efficient token tracking, tag length limits, overflow protection.
 */
contract NOPPositionNFT is ERC721, Ownable, Pausable {
    struct PositionMeta {
        address pool;
        uint256 amount;
        uint64 createdAt;
        string tag; // e.g. contribute title hash or short label
    }

    uint256 private _nextId;
    mapping(uint256 => PositionMeta) public positions;
    
    // Authorized minters (e.g., NOPSocialPool contract)
    mapping(address => bool) public authorizedMinters;

    // Gas-efficient token tracking: owner => tokenIds[]
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex; // tokenId => index in _ownedTokens[owner]

    // Constants
    uint256 public constant MAX_TAG_LENGTH = 100; // Maximum tag length to prevent gas issues
    uint256 public constant MAX_TOKEN_ID = type(uint256).max - 1; // Prevent overflow

    event PositionMinted(uint256 indexed tokenId, address indexed to, address pool, uint256 amount, string tag);
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);

    error TagTooLong();
    error TokenIdOverflow();
    error InvalidAddress();

    constructor() ERC721("NOP Position", "NOPPOS") Ownable(msg.sender) {
        _nextId = 1;
    }

    /**
     * @dev Authorizes an address to mint NFTs (e.g., NOPSocialPool contract).
     * @param minter The address to authorize
     */
    function authorizeMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert InvalidAddress();
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    /**
     * @dev Revokes minting authorization from an address.
     * @param minter The address to revoke
     */
    function revokeMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert InvalidAddress();
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    /**
     * @dev Pause all operations (emergency use)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause all operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Mints a new position NFT.
     * Can be called by owner or authorized minters (e.g., NOPSocialPool).
     * @param to The address to mint the NFT to
     * @param pool The pool address associated with this position
     * @param amount The amount of NOP in this position
     * @param tag A short label or tag for this position
     * @return tokenId The ID of the newly minted NFT
     */
    function mintPosition(
        address to,
        address pool,
        uint256 amount,
        string memory tag
    ) external whenNotPaused returns (uint256 tokenId) {
        require(
            msg.sender == owner() || authorizedMinters[msg.sender],
            "NOPPositionNFT: Not authorized to mint"
        );
        
        if (to == address(0) || pool == address(0)) revert InvalidAddress();
        if (bytes(tag).length > MAX_TAG_LENGTH) revert TagTooLong();
        
        // Check for overflow
        if (_nextId >= MAX_TOKEN_ID) revert TokenIdOverflow();
        
        tokenId = _nextId++;
        _safeMint(to, tokenId);
        
        // Add to gas-efficient tracking
        _addTokenToOwnerEnumeration(to, tokenId);
        
        positions[tokenId] = PositionMeta({
            pool: pool,
            amount: amount,
            createdAt: uint64(block.timestamp),
            tag: tag
        });
        
        emit PositionMinted(tokenId, to, pool, amount, tag);
    }

    /**
     * @dev Gets position metadata for a token ID.
     * @param tokenId The token ID to query
     * @return The position metadata
     */
    function getPosition(uint256 tokenId) external view returns (PositionMeta memory) {
        return positions[tokenId];
    }

    /**
     * @dev Gets all token IDs owned by a wallet (gas-efficient version).
     * @param owner The wallet address to query
     * @return An array of token IDs owned by the wallet
     */
    function walletTokens(address owner) external view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    /**
     * @dev Internal function to add token to owner enumeration.
     */
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        uint256 length = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);
        _ownedTokensIndex[tokenId] = length;
    }

    /**
     * @dev Internal function to remove token from owner enumeration.
     */
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        delete _ownedTokensIndex[tokenId];
        _ownedTokens[from].pop();
    }

    /**
     * @dev Override _update to maintain token enumeration.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);

        if (previousOwner != address(0)) {
            _removeTokenFromOwnerEnumeration(previousOwner, tokenId);
        }

        if (to != address(0)) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }

        return previousOwner;
    }
}

