const crypto = require('crypto'); 
const SHA256 = message => crypto.createHash('sha256').update(message).digest('hex');

const EC = require('elliptic').ec
const ec = new EC('secp256k1');
const MINT_WALLET = ec.genKeyPair();
const MINT_PUBLIC_ADDRESS = MINT_WALLET.getPublic('hex');
// const MINT_PRIVATE_ADDRESS = MINT_WALLET.getPrivate('hex');

class Block {
	constructor(data = []) {
		this.timestamp = Date.now();
		this.data = data;
		this.hash = this.getHash();
		this.prevHash = '';
		this.nonce = 0;
	}

	getHash() {
		return SHA256(this.timestamp + JSON.stringify(this.data) + this.prevHash + this.nonce);
	}

	mine(difficulty) {
		while (!this.hash.startsWith(Array(difficulty + 1).join('0'))) {
			this.nonce += 1;
			this.hash = this.getHash();
		}
	}
}

class Blockchain {
	constructor() {
		this.chain = [new Block(['Genesis Transaction'])];
		this.difficulty = 2;
		this.blockTime = 5000;
		this.transactions = [];
		this.reward = 10;
	}

	addTransaction(transaction) {
		this.transactions.push(transaction);
	}

	mineTransactions(rewardAddress) {
		const rewardTransaction = new Transaction(MINT_PUBLIC_ADDRESS, rewardAddress, this.reward);
		this.addBlock(new Block([rewardTransaction, ...this.transactions]));
		this.transactions = [];
	}

	getLastBlock() {
		return this.chain[this.chain.length - 1];
	}

	addBlock(block) {
		block.prevHash = this.getLastBlock().hash;
		block.mine(this.difficulty);

		this.chain.push(block);
		this.difficulty += Date.now() - this.getLastBlock().timestamp < this.blockTime ? 1 : -1;
	}

	isValid() {
		for (let i = 1; i < this.chain.length; i++) {
			const currentBlock = this.chain[i];
			const prevBlock = this.chain[i - 1];

			if (currentBlock.hash !== currentBlock.getHash() || currentBlock.prevHash !== prevBlock.hash) {
				return false;
			}
			return true;
		}
	}
}

class Transaction {
	constructor(from, to, amount) {
		this.from = from;
		this.to = to;
		this.amount = amount;
	}

	sign(keyPair) {
		if (keyPair.getPublic('hex') === this.from) {
			this.signature = keyPair.sign(SHA256(this.from + this.to + this.amount)).toDER('hex');
		}
	}
}

const JOHN_WALLET = ec.genKeyPair();
const JENIFER_WALLET = ec.genKeyPair();
const MINER_WALLET = ec.genKeyPair();

const MyBlockChain = new Blockchain();

const transaction = new Transaction(JOHN_WALLET.getPublic('hex'), JENIFER_WALLET.getPrivate('hex'), 100);
// transaction.sign(JOHN_WALLET);

console.log(MyBlockChain.chain);
console.log(`JOHN_WALLET public : ${JOHN_WALLET.getPublic('hex')}`)
console.log(`JOHN_WALLET private : ${JOHN_WALLET.getPrivate('hex')}`)




// const transaction = new Transaction(JOHN_WALLET.getPublic('hex'))

// MyBlockChain.addBlock(new Block(['Transaction 1']));
// MyBlockChain.addBlock(new Block(['Transaction 2']));
// MyBlockChain.addBlock(new Block(['Transaction 3']));


// console.log(MyBlockChain.chain);
// console.log(`MyBlockChain Valid Check: ${MyBlockChain.isValid()}`);


// console.log(`Public: ${MINT_PUBLIC_ADDRESS}`);
// console.log(`Private: ${MINT_PRIVATE_ADDRESS}`);

// const block1 = new Block(['Transaction 1']);
// console.log(block1);

// block1.mine(5);
// console.log(block1);