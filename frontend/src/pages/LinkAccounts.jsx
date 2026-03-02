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
      } catch (err) {
        setLinkError(err.message || "Failed to create Plaid link token.");
      } finally {
        setIsCreatingToken(false);
      }
    };

    createLinkToken();
  }, [user]);

  const onSuccess = async (public_token) => {
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
        body: JSON.stringify({ public_token }),
      });
      const data = await response.json();

      if (!response.ok) {
        setLinkError(data.error || "Failed to link account.");
        return;
      }

      setSyncMessage("Account linked successfully.");
    } catch (err) {
      setLinkError(err.message || "Failed to link account.");
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken || null,
    onSuccess,
  });

  const onClick = (event) => {
    event.preventDefault();
    if (ready) {
      open();
    }
  };

  return (
    <div>
      <p className="note">
        **NOTE** <br></br> <br></br> Although the code is working, Wallet Watch
        is not currently approved for Plaid&apos;s Production Environment.
        Unfortunately this means that many of the major banks will not allow
        Wallet Watch users to connect due to security risks. As a result,{" "}
        <span className="underline">
          Plaid&apos;s Sandbox Environment is currently being used
        </span>{" "}
        so that users can still test out the functionality of this feature with
        fake data.
        <br></br> <br></br>
        username: user_good <br></br> password: pass_good <br></br> verification
        code: 1234 (if needed)
        <br></br> <br></br>
        We apologize for the inconvenience.
      </p>
      {isCreatingToken && (
        <p style={{ color: "#414141", fontSize: "0.9em" }}>
          Preparing secure bank-link session...
        </p>
      )}
      {linkError && (
        <p style={{ color: "#cb0808", fontSize: "0.9em" }}>{linkError}</p>
      )}
      {syncMessage && (
        <p style={{ color: "#1bad7a", fontSize: "0.9em" }}>{syncMessage}</p>
      )}
      <div className="linkaccountbuttondiv">
        <button
          className="linkaccountbutton"
          onClick={onClick}
          disabled={!linkToken || !ready || isCreatingToken}
        >
          Click here to link accounts
        </button>
      </div>
    </div>
  );
};

export default LinkAccounts;
