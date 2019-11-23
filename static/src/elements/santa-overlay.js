import {html, LitElement} from 'lit-element';
import {until} from 'lit-html/directives/until.js';
import styles from './santa-overlay.css';
import {_msg} from '../magic.js';
import './santa-button.js';


async function shortenUrl(raw) {
  // Firebase is only configured to serve links under `https://santatracker.google.com`.
  const key = 'AIzaSyBrNcGcna0TMn2uLRxhMBwxVwXUBjlZqzU';
  const domain = 'https://santatracker.google.com';

  if (!raw) {
    return '';
  }

  const ensureDomainURL = new URL(raw, domain);
  const url = new URL(ensureDomainURL.pathname + ensureDomainURL.search, domain);

  const response = await window.fetch(`https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${key}`, {
    method: 'POST',
    body: JSON.stringify({dynamicLinkInfo: {
      domainUriPrefix: 'https://santatracker.page.link',
      link: url.toString(),
    }}),
  });

  const body = await response.json();
  console.info(url.toString(), '=>', body);
  if ('shortLink' in body) {
    return body['shortLink'];
  }
  throw new Error(`shortLink invalid data: ${JSON.stringify(body)}`);
}


export class SantaOverlayElement extends LitElement {
  static get properties() {
    return {
      isPaused: {type: Boolean},
      shareUrl: {type: String},
      _shortUrl: {type: Promise},
    };
  }

  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets = [styles];
  }

  _dispatchRestart(e) {
    this.dispatchEvent(new CustomEvent('restart'));
  }

  _dispatchResume() {
    this.dispatchEvent(new CustomEvent('resume'));
  }

  _dispatchHome() {
    window.dispatchEvent(new CustomEvent('go'));  // home
  }

  update(changedProperties) {
    if (changedProperties.has('shareUrl')) {
      this._shortUrl = shortenUrl(this.shareUrl);
    }
    return super.update(changedProperties);
  }

  _copyUrl(ev) {
    ev.target.select();
    document.execCommand('copy');
    ev.target.setSelectionRange(0, 0);

    const url = ev.target.parentNode;
    url.classList.add('copy');
    window.setTimeout(() => {
      url.classList.remove('copy');
    }, 1000);
  }

  render() {
    const hasUrl = Boolean(this.shareUrl);
    const heroClass = hasUrl ? 'share' : (this.isPaused ? 'pause' : 'gameover');

    return html`
<div class="backdrop">
  <main>
    <div class="hero ${heroClass}">
      <h1>${_msg`gameover`}</h1>
    </div>
    <nav>
      <div class="url" ?hidden=${!hasUrl}>
        <h4>${_msg`copy-me-short`}</h4>
        <input type="text" value=${until(this._shortUrl, this.shareUrl)} readonly @click=${this._copyUrl} />
      </div>
      <div class="buttons">
        <santa-button color="purple" @click="${this._dispatchResume}" ?hidden=${!this.isPaused}>
          <svg class="icon"><path d="M8 5v14l11-7z"/></svg>
        </santa-button>
        <santa-button color="purple" @click="${this._dispatchRestart}">
          <svg class="icon"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        </santa-button>
        <santa-button color="theme" @click="${this._dispatchHome}" data-action="home">
          <svg class="icon"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </santa-button>
      </div>
    </nav>
  </main>
  <div class="below">
    <slot></slot>
  </div>
</div>
`;
  }
}


customElements.define('santa-overlay', SantaOverlayElement);