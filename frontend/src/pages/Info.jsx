const Info = () => {
  return (
    <div className="content-shell">
      <section className="content-card">
        <p className="eyebrow">About Wallet Watch</p>
        <h1>Personal finance visibility without spreadsheet overhead.</h1>
        <p>
          Wallet Watch helps you monitor cash movement across connected accounts
          and manual entries so your transaction ledger stays accurate.
        </p>
      </section>

      <section className="content-grid">
        <article className="content-card">
          <h2>What You Can Do</h2>
          <ul>
            <li>Sync transactions from connected banks through Plaid.</li>
            <li>Manually add or remove transactions any time.</li>
            <li>View total income, spending, and overall cash flow.</li>
          </ul>
        </article>

        <article className="content-card">
          <h2>Why It Works</h2>
          <ul>
            <li>Simple dashboard with transaction sorting and quick filtering.</li>
            <li>Fast overview cards so trends are visible at a glance.</li>
            <li>Single account login with route protection for private data.</li>
          </ul>
        </article>
      </section>
    </div>
  );
};

export default Info;
