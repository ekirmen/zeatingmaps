import { validate as uuidValidate } from 'uuid';

export const isUuid = (value) => uuidValidate(value);

export const isNumericId = (value) => typeof value === 'string' && /^\d+$/.test(value);

export default isUuid;
