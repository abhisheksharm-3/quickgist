import Layout from '../components/Layout'
import { SignUp } from '@clerk/clerk-react'

export default function SignUpPage() {
  return (<Layout className='flex items-center'><SignUp path="/sign-up" /></Layout>)
}