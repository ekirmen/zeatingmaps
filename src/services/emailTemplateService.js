import API_BASE_URL from '../utils/apiBase';

const AutoWrapped_9lswhp = (props) => {
  const API_BASE_URL_WITH_API = API_BASE_URL + '/api';

  export 
    const res = await fetch(`${API_BASE_URL_WITH_API}/email-templates`, {
      headers: { Authorization: authHeader }
    });

    return res.json();
  };

  export 
    const res = await fetch(`${API_BASE_URL_WITH_API}/email-templates/${type}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error saving template');
    return res.json();
  };

};

export default AutoWrapped_9lswhp;