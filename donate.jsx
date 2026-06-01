// Компонент для пожертвований

function DonateModal({isOpen, onClose}) {
  if (!isOpen) return null;

  const platforms = [
    {
      name: 'DonatePay',
      url: 'https://donatepay.ru/don/1498733',
      color: '#FF6B6B',
      logo: 'img/logo_donatepay.png'
    },
    {
      name: 'DonationAlerts',
      url: 'https://www.donationalerts.com/r/metafirestorm',
      color: '#F89738',
      logo: 'img/logo_donationalerts.png'
    }
  ];

  const handleDonate = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="donate-overlay" onClick={onClose}>
      <div className="donate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="donate-header">
          <h2 className="donate-title">💰 Поддержать проект</h2>
          <button className="donate-close" onClick={onClose}>✕</button>
        </div>

        <p className="donate-hint">
          Pls yopta ❤️
        </p>

        <div className="donate-platforms">
          {platforms.map((platform, index) => (
            <button
              key={index}
              className="donate-platform-btn"
              onClick={() => handleDonate(platform.url)}
              style={{'--platform-color': platform.color}}
            >
              <div className="donate-platform-logo">
                <img src={platform.logo} alt={platform.name} />
              </div>
            </button>
          ))}
        </div>

        <div className="donate-footer">
          <p className="donate-footer-text">
            Любая сумма помогает! Не обязательно жертвовать много 😊
          </p>
        </div>
      </div>
    </div>
  );
}

window.DONATE = { DonateModal };
