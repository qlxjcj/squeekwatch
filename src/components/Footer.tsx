import { CONTRACTS, DOCS, EXPLORER, OFFICIAL, explorerAddress } from "../lib/api";
import { useI18n } from "../lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h3 className="sub-title">SqueekWatch</h3>
          <p>{t("foot.about")}</p>
          <p className="fine-print">{t("foot.builtFor")}</p>
        </div>
        <div>
          <h3 className="sub-title">{t("foot.contracts")}</h3>
          <ul className="footer-list">
            {Object.entries(CONTRACTS).map(([name, address]) => (
              <li key={name}>
                <a href={explorerAddress(address)} target="_blank" rel="noopener noreferrer">
                  {name} · {address.slice(0, 10)}…
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="sub-title">{t("foot.links")}</h3>
          <ul className="footer-list">
            <li>
              <a href={DOCS} target="_blank" rel="noopener noreferrer">
                {t("foot.docs")}
              </a>
            </li>
            <li>
              <a href="https://docs.squeekchain.com/developers/api/" target="_blank" rel="noopener noreferrer">
                {t("foot.api")}
              </a>
            </li>
            <li>
              <a href="https://docs.squeekchain.com/whitepaper/" target="_blank" rel="noopener noreferrer">
                {t("foot.whitepaper")}
              </a>
            </li>
            <li>
              <a href={OFFICIAL} target="_blank" rel="noopener noreferrer">
                squeekchain.com
              </a>
            </li>
            <li>
              <a href={EXPLORER} target="_blank" rel="noopener noreferrer">
                {t("foot.explorer")}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="footer-note mono">{t("foot.note")}</p>
    </footer>
  );
}
