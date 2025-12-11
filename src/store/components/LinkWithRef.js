import React from 'react';
import { Link } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';

const LinkWithRef = ({ to, ...props }) => {
  const { refParam } = useRefParam();


    return <Link to={to} {...props} />;
  }

  const appendRef = (target) => {
    if (typeof target === 'string') {
      const [pathname, search = ''] = target.split('?');
      const params = new URLSearchParams(search);
      if (!params.get('ref')) {
        params.set('ref', refParam);
      }
      const query = params.toString();
      return `${pathname}${query ? `?${query}` : ''}`;
    } else if (typeof target === 'object') {
      const params = new URLSearchParams(target.search || '');
      if (!params.get('ref')) {
        params.set('ref', refParam);
      }
      return { ...target, search: `?${params.toString()}` };
    }
    return target;
  };

  const finalTo = appendRef(to);

  return <Link to={finalTo} {...props} />;
};

export default LinkWithRef;
