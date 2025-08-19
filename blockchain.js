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

	hasValidTransaction(chain) {
		return this.data.every(transaction => transaction.isValid(transaction, chain));
	}
}

class Blockchain {
	constructor() {
		const initialCoinRelease = new Transaction(MINT_PUBLIC_ADDRESS, JOHN_WALLET.getPublic('hex'), 1000);
		this.chain = [new Block(['Genesis Transaction', initialCoinRelease])];
		this.difficulty = 2;
		this.blockTime = 5000;
		this.transactions = []; // mempool
		this.reward = 10;
	}

	addTransaction(transaction) {
		// validated by a full node (or by the wallet before broadcasting)
		if (transaction.isValid(transaction, this)) {
			this.transactions.push(transaction);
		}
	}

	mineTransactions(rewardAddress) {
		const rewardTransaction = new Transaction(MINT_PUBLIC_ADDRESS, rewardAddress, this.reward);

		if (this.transactions.length !== 0) {
			this.addBlock(new Block([rewardTransaction, ...this.transactions]));
		}
		this.transactions = [];
	}

	getBalance (address) {
		let balance = 0;

		this.chain.forEach(block => {
			block.data.forEach(transaction => {
				if (transaction.from === address) {
					balance -= transaction.amount;
				} else if (transaction.to === address) {
					balance += transaction.amount;
				}
			})
		})
		return balance;
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

			if (currentBlock.hash !== currentBlock.getHash() ||
				currentBlock.prevHash !== prevBlock.hash ||
				!currentBlock.hasValidTransaction(this)) {
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

	isValid (tx, chain) {
		return (
			tx.from &&
			tx.to &&
			tx.amount &&
			chain.getBalance(tx.from) >= tx.amount &&
			ec.keyFromPublic(tx.from, 'hex').verify(SHA256(tx.from + tx.to + tx.amount), tx.signature)
		)
	}
}

const JOHN_WALLET = ec.genKeyPair();
const JENIFER_WALLET = ec.genKeyPair();
const MINER_WALLET = ec.genKeyPair();

const MyBlockChain = new Blockchain();

// create a transaction
const transaction = new Transaction(JOHN_WALLET.getPublic('hex'), JENIFER_WALLET.getPublic('hex'), 100);
// Sign the transaction
transaction.sign(JOHN_WALLET);
// add transaction to mempool
MyBlockChain.addTransaction(transaction);
// mine transaction
MyBlockChain.mineTransactions(MINER_WALLET.getPublic('hex'));





console.dir(MyBlockChain.chain, { depth: null, colors: true });

console.log("John's Balance", MyBlockChain.getBalance(JOHN_WALLET.getPublic('hex')));

// console.log(MyBlockChain.chain);
// console.log(`JOHN_WALLET public : ${JOHN_WALLET.getPublic('hex')}`)
// console.log(`JOHN_WALLET private : ${JOHN_WALLET.getPrivate('hex')}`)

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