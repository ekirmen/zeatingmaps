import { validate as uuidValidate } from 'uuid';

export const isUuid = (value) => uuidValidate(value);

export default isUuid;
