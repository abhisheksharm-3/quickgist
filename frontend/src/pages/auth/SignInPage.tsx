import { SignIn } from '@clerk/clerk-react';

export function SignInPage() {
    return (
        <div className="page-container flex items-center justify-center min-h-[60vh]">
            <SignIn routing="path" path="/sign-in" />
        </div>
    );
}
