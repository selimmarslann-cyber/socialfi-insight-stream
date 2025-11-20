// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NOPPositionNFT V2
 * @dev ERC721-based Position NFT with authorized minter support.
 * This version allows the NOPSocialPool contract to mint NFTs directly.
 */
contract NOPPositionNFT is ERC721, Ownable {
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

    event PositionMinted(uint256 indexed tokenId, address indexed to, address pool, uint256 amount, string tag);
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);

    constructor() ERC721("NOP Position", "NOPPOS") Ownable(msg.sender) {
        _nextId = 1;
    }

    /**
     * @dev Authorizes an address to mint NFTs (e.g., NOPSocialPool contract).
     * @param minter The address to authorize
     */
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    /**
     * @dev Revokes minting authorization from an address.
     * @param minter The address to revoke
     */
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
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
    ) external returns (uint256 tokenId) {
        require(
            msg.sender == owner() || authorizedMinters[msg.sender],
            "NOPPositionNFT: Not authorized to mint"
        );
        
        tokenId = _nextId++;
        _safeMint(to, tokenId);
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
     * @dev Gets all token IDs owned by a wallet.
     * @param owner The wallet address to query
     * @return An array of token IDs owned by the wallet
     */
    function walletTokens(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory ids = new uint256[](balance);
        uint256 idx = 0;
        uint256 supply = _nextId;
        for (uint256 tokenId = 1; tokenId < supply; tokenId++) {
            try this.ownerOf(tokenId) returns (address tokenOwner) {
                if (tokenOwner == owner) {
                    ids[idx++] = tokenId;
                    if (idx == balance) break;
                }
            } catch {
                // Token doesn't exist, skip
                continue;
            }
        }
        return ids;
    }
}

