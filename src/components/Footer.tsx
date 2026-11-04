import { CONTRACTS, DOCS, EXPLORER, OFFICIAL, explorerAddress } from "../lib/api";
import { OutLink } from "./ui";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h3 className="sub-title">SqueekWatch</h3>
          <p>
            A community dashboard for Squeekchain, the hamster-powered proof-of-work toychain on
            Ethereum Sepolia. Data comes from the official public API; the app is strictly
            read-only — no wallet connection, nothing is ever signed.
          </p>
          <p className="fine-print">
            Built for the Squeekchain Genesis · Code lane. Not affiliated with or endorsed by the
            Squeekchain team. Testnet software: nothing here is financial advice.
          </p>
        </div>
        <div>
          <h3 className="sub-title">Contracts (Sepolia)</h3>
          <ul className="footer-list">
            {Object.entries(CONTRACTS).map(([name, address]) => (
              <li key={name}>
                <OutLink href={explorerAddress(address)}>
                  {name} · {address.slice(0, 10)}…
                </OutLink>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="sub-title">Links</h3>
          <ul className="footer-list">
            <li>
              <OutLink href={DOCS}>Documentation</OutLink>
            </li>
            <li>
              <OutLink href="https://docs.squeekchain.com/developers/api/">API reference</OutLink>
            </li>
            <li>
              <OutLink href="https://docs.squeekchain.com/whitepaper/">Whitepaper</OutLink>
            </li>
            <li>
              <OutLink href={OFFICIAL}>squeekchain.com</OutLink>
            </li>
            <li>
              <OutLink href={EXPLORER}>Block explorer</OutLink>
            </li>
          </ul>
        </div>
      </div>
      <p className="footer-note mono">
        chain 11155111 (Sepolia) · data delayed 12 confirmations · &quot;unavailable&quot; means
        unknown, never zero
      </p>
    </footer>
  );
}
