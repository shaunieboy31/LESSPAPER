import { string, object } from 'yup';

const FormValidation = object().shape({
  subject: string().required('Required'),
  grade: string().required('Required')
});

export const initialForm = {
  subject: '',
  grade: ''
};

export default FormValidation;
