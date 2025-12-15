// src/utils/antdWrapper.js
import React from 'react';

// Try-catch para diferentes versiones
let Button, Card, Form, Input, Select, Modal, Spin;

try {
  // Intentar importar de antd v5
  Button = require('antd/es/button').default;
  Card = require('antd/es/card').default;
  Form = require('antd/es/form').default;
  Input = require('antd/es/input').default;
  Select = require('antd/es/select').default;
  Modal = require('antd/es/modal').default;
  Spin = require('antd/es/spin').default;
} catch (e) {
  // Fallback a antd v4
  Button = require('antd/lib/button').default;
  Card = require('antd/lib/card').default;
  Form = require('antd/lib/form').default;
  Input = require('antd/lib/input').default;
  Select = require('antd/lib/select').default;
  Modal = require('antd/lib/modal').default;
  Spin = require('antd/lib/spin').default;
}

export { Button, Card, Form, Input, Select, Modal, Spin };
