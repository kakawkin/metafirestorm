// Компонент обратной связи - отправка в Discord webhook

function FeedbackModal({isOpen, onClose, discordWebhook}) {
  const [name, setName] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [status, setStatus] = React.useState(null); // 'success' | 'error' | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      alert('Пожалуйста, напишите сообщение');
      return;
    }

    setSending(true);
    setStatus(null);

    try {
      // Формируем красивое embed-сообщение для Discord
      const embed = {
        title: '💬 Новая обратная связь с сайта',
        color: 0xF89737, // Цвет акцента сайта
        fields: [
          {
            name: '👤 От кого',
            value: name.trim() || 'Аноним',
            inline: true
          },
          {
            name: '📅 Дата',
            value: new Date().toLocaleString('ru-RU'),
            inline: true
          },
          {
            name: '💬 Сообщение',
            value: message.trim()
          }
        ],
        footer: {
          text: 'Firestorm Stats — Обратная связь'
        }
      };

      const response = await fetch(discordWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      });

      if (response.ok) {
        setStatus('success');
        setName('');
        setMessage('');
        setTimeout(() => {
          onClose();
          setStatus(null);
        }, 2000);
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Ошибка отправки в Discord:', error);
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-header">
          <h2 className="feedback-title">💬 Обратная связь</h2>
          <button className="feedback-close" onClick={onClose}>✕</button>
        </div>

        <p className="feedback-hint">
          Если есть предложения по наполнению, то можете указать в поле имя свой ник в Discord, чтобы я мог с вами связаться.
        </p>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="feedback-field">
            <label className="feedback-label">Ваше имя (необязательно)</label>
            <input
              type="text"
              className="feedback-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Аноним"
              maxLength={50}
              disabled={sending}
            />
          </div>

          <div className="feedback-field">
            <label className="feedback-label">Сообщение *</label>
            <textarea
              className="feedback-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ваши предложения, баг-репорты, пожелания..."
              rows={6}
              maxLength={1000}
              disabled={sending}
              required
            />
            <div className="feedback-counter">{message.length} / 1000</div>
          </div>

          {status === 'success' && (
            <div className="feedback-status feedback-success">
              ✓ Сообщение отправлено! Спасибо за обратную связь!
            </div>
          )}

          {status === 'error' && (
            <div className="feedback-status feedback-error">
              ✗ Ошибка отправки. Попробуйте позже или напишите напрямую в Discord.
            </div>
          )}

          <div className="feedback-buttons">
            <button
              type="button"
              className="feedback-btn feedback-btn-cancel"
              onClick={onClose}
              disabled={sending}>
              Отмена
            </button>
            <button
              type="submit"
              className="feedback-btn feedback-btn-submit"
              disabled={sending}>
              {sending ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

window.FEEDBACK = { FeedbackModal };
