import React, { useState, useEffect } from "react";
import { FaCoins } from "react-icons/fa";
import { Connection, PublicKey, Transaction, SystemProgram, SendTransactionError } from "@solana/web3.js";

function App() {
  const [quantity, setQuantity] = useState(1);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [network] = useState("https://solana-mainnet.g.alchemy.com/v2/Afxy8WfUjV3mYgZx6Ul6DxTz8PEbzZ3o");
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [walletConnectedPopup, setWalletConnectedPopup] = useState(false);

  useEffect(() => {
    // Check if Phantom wallet is connected
    const checkWalletConnection = async () => {
      if (window.solana) {
        if (window.solana.isPhantom) {
          setConnected(window.solana.isConnected);
        }
      } else {
        // Wait for Phantom wallet to be injected
        window.addEventListener("load", () => {
          if (window.solana) {
            if (window.solana.isPhantom) {
              setConnected(window.solana.isConnected);
            }
          } else {
            console.error("Phantom wallet not found. Please install it from https://phantom.app/");
          }
        });
      }
    };

    checkWalletConnection();
  }, []);

  const handleBuyNow = async (event) => {
    event.preventDefault();

    try {
      const connection = new Connection(network, "confirmed");
      const provider = window.solana;

      if (!provider) {
        setTransactionStatus("Phantom wallet not found. Please install it from https://phantom.app/");
        return;
      }

      if (!connected) {
        await provider.connect();
        setConnected(true);
        setWalletConnectedPopup(true);
        setTimeout(() => {
          setWalletConnectedPopup(false);
        }, 3000);
      }

      const { blockhash } = await connection.getRecentBlockhash();
      const recipientAddress = new PublicKey("Dm9t8GdsJ17GdAs8mRR3V1BtFA1QnbX3jimNaU4QB5cn");

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: recipientAddress,
          lamports: quantity * 1000000000,
        })
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = provider.publicKey;

      setLoading(true);
      const signedTransaction = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      console.log("Transaction sent:", signature);

      await connection.confirmTransaction(signature);

      setTransactionStatus("Transfer successful");
      setLoading(false);
      setQuantity(1);

      setTimeout(() => {
        setTransactionStatus(null);
      }, 5000);
    } catch (error) {
      console.error("Error sending transaction:", error);
      setLoading(false);

      let errorMessage = "Transaction failed";
      if (error instanceof SendTransactionError) {
        const logs = await error.getLogs();
        console.error("Transaction logs:", logs);
        if (logs.includes("Attempt to debit an account but found no record of a prior credit")) {
          errorMessage = "Insufficient funds in wallet.";
        } else {
          errorMessage = `Transaction failed: ${logs.join(", ")}`;
        }
      } else if (error.message.includes("403")) {
        errorMessage = "Access forbidden. Please contact your app developer or support@rpcpool.com.";
      } else if (error.message.includes("blockhash")) {
        errorMessage = "Failed to fetch recent blockhash. Please try again.";
      } else if (error.message.includes("connection")) {
        errorMessage = "Network connection issue. Please check your internet connection and try again.";
      } else if (error.message.includes("user rejected")) {
        errorMessage = "Transaction rejected by user.";
      }

      setTransactionStatus(errorMessage);

      setTimeout(() => {
        setTransactionStatus(null);
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col items-center mt-6 lg:mt-20">
      <div className="w-full max-w-lg mx-auto mt-10 p-8 rounded-lg shadow-lg border border-neutral-700" style={{ backgroundColor: "#FFF6B5" }}>
        <h2 className="text-2xl font-bold text-center text-black mb-4">Buy $BEBO</h2>
        <form onSubmit={handleBuyNow}>
          <div className="mb-4 relative">
            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="tokenQuantity">
              Enter SOL
            </label>
            <div className="flex items-center relative">
              <input
                id="tokenQuantity"
                type="number"
                className="w-full px-3 py-2 pl-4 pr-10 bg-gray-800 text-white border rounded-md shadow-sm focus:outline-none focus:ring focus:border-orange-500"
                placeholder="1 SOL"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <FaCoins className="text-gray-400 absolute right-3" />
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <button
              type="submit"
              className={`bg-gradient-to-r from-orange-500 to-orange-800 text-white font-bold py-2 px-4 rounded-md shadow-md hover:from-orange-600 hover:to-orange-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {connected ? (loading ? "Sending..." : "Buy Now") : "Connect Wallet"}
            </button>
          </div>
        </form>

        {transactionStatus && (
          <div className={`px-4 py-2 rounded-md text-center mb-4 ${transactionStatus.includes("successful") ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {transactionStatus}
          </div>
        )}

        {walletConnectedPopup && (
          <div className="bg-blue-500 text-white px-4 py-2 rounded-md text-center mb-4">
            Wallet connected!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
