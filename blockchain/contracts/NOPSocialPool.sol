// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NOPSocialPool {
    struct Position {
        address owner;
        uint amount;
        uint timestamp;
    }

    mapping(address => Position[]) public positions;

    event NewPosition(address indexed user, uint amount, uint timestamp);

    function openPosition(uint amount) external {
        require(amount > 0, "Amount must be > 0");
        positions[msg.sender].push(Position(msg.sender, amount, block.timestamp));
        emit NewPosition(msg.sender, amount, block.timestamp);
    }

    function getPositions(address user) external view returns (Position[] memory) {
        return positions[user];
    }
}

