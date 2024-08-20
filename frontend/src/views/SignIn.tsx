import Layout from '../components/Layout'
import { SignIn } from '@clerk/clerk-react'

export default function SignInPage() {
  return (
    <Layout className='flex items-center'><SignIn path="/sign-in" /></Layout>
  )
}