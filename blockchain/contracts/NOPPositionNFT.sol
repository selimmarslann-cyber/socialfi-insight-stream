// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NOPPositionNFT
 * @dev ERC721-based Position NFT that represents a user's social positions.
 * This is a parallel layer to NOPSocialPool, storing position metadata as NFTs.
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

    constructor() ERC721("NOP Position", "NOPPOS") Ownable(msg.sender) {
        _nextId = 1;
    }

    /**
     * @dev Mints a new position NFT.
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
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextId++;
        _safeMint(to, tokenId);
        positions[tokenId] = PositionMeta({
            pool: pool,
            amount: amount,
            createdAt: uint64(block.timestamp),
            tag: tag
        });
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

