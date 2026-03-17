import { string, object } from 'yup';

const LoginValidation = object().shape({
  username: string().required('Required'),
  password: string().required('Required')
});

export const initialLog = {
  username: '',
  password: ''
};
export default LoginValidation;
