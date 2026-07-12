// Компонент обратной связи — отправка через Google Apps Script прокси
// Webhook URL Discord спрятан на сервере Google Apps Script

const FEEDBACK_PROXY_URL = 'https://script.google.com/macros/s/AKfycbwS4cJcWtv6AXNqDhEoUR5xmAen-MBddZLL1JC6QXpIioe-y_WV2OXPP0DDWJ1R_dWo/exec';

function FeedbackModal({isOpen, onClose}) {
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
      // Google Apps Script не поддерживает CORS заголовки в V8 runtime.
      // Используем GET + mode: 'no-cors' — браузер не проверяет CORS,
      // запрос доходит до сервера, но response не читаем (opaque).
      const params = new URLSearchParams();
      params.set('name', name.trim() || 'Аноним');
      params.set('message', message.trim());
      params.set('date', new Date().toLocaleString('ru-RU'));
      
      await fetch(FEEDBACK_PROXY_URL + '?' + params.toString(), {
        method: 'GET',
        mode: 'no-cors'
      });

      // С no-cors мы не можем проверить ответ, но запрос ушёл.
      // Показываем успех сразу (если нет сетевой ошибки — fetch не бросит исключение).
      setStatus('success');
      setName('');
      setMessage('');
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Ошибка отправки:', error);
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
