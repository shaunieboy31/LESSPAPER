import { string, object } from 'yup';

const regValidation = object().shape({
  email: string().required('Required'),
  firstname: string().required('Required'),
  lastname: string().required('Required'),
  middlename: string(),
  contactNumber: string().required('Required'),
  password: string().required('Required'),
  confirmPassword: string().required('Required')
});

export const initialReg = {
  email: '',
  firstname: '',
  lastname: '',
  middlename: '',
  contactNumber: '',
  password: '',
  confirmPassword: ''
};
export default regValidation;
