import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useAuthContext } from "../hooks/useAuthContext";
import { apiFetch } from "../lib/api";

const LinkAccounts = () => {
  const { user } = useAuthContext();
  const [linkToken, setLinkToken] = useState("");
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    const createLinkToken = async () => {
      if (!user) {
        return;
      }

      setIsCreatingToken(true);
      setLinkError(null);

      try {
        const response = await apiFetch("/api/plaid/create_link_token", {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          setLinkError(data.error || "Failed to create Plaid link token.");
          return;
        }

        setLinkToken(data.link_token);
      } catch (error) {
        setLinkError(error.message || "Failed to create Plaid link token.");
      } finally {
        setIsCreatingToken(false);
      }
    };

    createLinkToken();
  }, [user]);

  const onSuccess = async (publicToken) => {
    if (!user) {
      return;
    }

    setSyncMessage("");
    setLinkError(null);

    try {
      const response = await apiFetch("/api/plaid/set_access_token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_token: publicToken }),
      });
      const data = await response.json();

      if (!response.ok) {
        setLinkError(data.error || "Failed to link account.");
        return;
      }

      setSyncMessage("Account linked successfully.");
    } catch (error) {
      setLinkError(error.message || "Failed to link account.");
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken || null,
    onSuccess,
  });

  const handleLinkClick = (event) => {
    event.preventDefault();
    if (ready) {
      open();
    }
  };

  return (
    <div className="content-shell">
      <section className="content-card">
        <p className="eyebrow">Bank Linking</p>
        <h1>Connect your bank accounts securely with Plaid.</h1>
        <p>
          Start a secure Plaid Link flow to bring transactions into Wallet Watch.
          You can sync manually any time from your dashboard.
        </p>
      </section>

      <section className="content-card sandbox-card">
        <h2>Sandbox Credentials</h2>
        <p>
          Wallet Watch is currently running on Plaid&apos;s sandbox environment
          while production approval is in progress.
        </p>
        <ul>
          <li>Username: user_good</li>
          <li>Password: pass_good</li>
          <li>Verification code: 1234 (if prompted)</li>
        </ul>

        {isCreatingToken && (
          <p className="status-message status-neutral">
            Preparing secure bank-link session...
          </p>
        )}
        {linkError && <p className="status-message status-error">{linkError}</p>}
        {syncMessage && (
          <p className="status-message status-success">{syncMessage}</p>
        )}

        <button
          className="primary-button linkaccountbutton"
          onClick={handleLinkClick}
          disabled={!linkToken || !ready || isCreatingToken}
          type="button"
        >
          {isCreatingToken ? "Preparing..." : "Launch Plaid Link"}
        </button>
      </section>
    </div>
  );
};

export default LinkAccounts;
