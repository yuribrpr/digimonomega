import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// Adicionar interceptor para token se necessário (muitos arquivos adicionam header manualmente, mas podemos centralizar depois)
// Por enquanto, vamos manter simples para substituir apenas a URL base.

export default api;
