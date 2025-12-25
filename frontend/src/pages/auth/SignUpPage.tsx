import { SignUp } from '@clerk/clerk-react';

export function SignUpPage() {
    return (
        <div className="page-container flex items-center justify-center min-h-[60vh]">
            <SignUp routing="path" path="/sign-up" />
        </div>
    );
}
