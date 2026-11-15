# جُمان — واجهة المحادثة المرجعية

واجهة محادثة مرجعية لجُمان مبنية على [assistant-ui](https://github.com/assistant-ui/assistant-ui). تدعم العربية واتجاه الكتابة من اليمين لليسار، وتعرض مصدرًا أسفل كل إجابة، وتميّز حالة "غير مشمول"، وتتطلب موافقة بشرية قبل تنفيذ أي إجراء مقترح.

**الحالة:** معاينة — الخادم التجريبي يُرجع إجابات ثابتة فقط.

---

# Juman Chat UI

Juman's reference chat frontend built on [assistant-ui](https://github.com/assistant-ui/assistant-ui).

- **Arabic-first and RTL** layout.
- A **source link** under every answer.
- A distinct **"not covered"** state when content is outside scope.
- **Human approval** before any proposed action is executed.

**Status:** PREVIEW — the demo backend returns canned answers.

## Running

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend listens on `http://localhost:8000` by default.

Set `JUMAN_ALLOWED_ORIGINS` to a comma-separated list of allowed CORS origins (default: `http://localhost:3000`).

### Frontend

```bash
cd web
cp .env.example .env.local   # adjust NEXT_PUBLIC_JUMAN_API_URL if needed
npm ci
npm run build
npm start
```

The frontend runs on `http://localhost:3000` by default.

## Known limitations

- Approval is not bound to an authenticated user.
- Pending actions are kept in memory (lost on restart).
- Fonts are fetched from Google at build time — self-host them for offline builds.
- Iframe height is fixed.

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE), [NOTICE](NOTICE), and [TRADEMARKS.md](TRADEMARKS.md).
