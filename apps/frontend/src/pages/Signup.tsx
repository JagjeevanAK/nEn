import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await axios.post(
        `${BACKEND_URL}/api/v1/auth/signup`,
        {
          email,
          password,
        },
        {
          withCredentials: true,
        }
      );
      navigate("/signin");
    } catch (err: unknown) {
      console.error("Signup error:", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Signup failed");
      } else {
        setError("Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-teal-50 via-white to-blue-50">
      <div className="flex flex-col gap-6 w-full max-w-md">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">nEn</h1>
          <div className="h-1 w-16 bg-teal-600 mx-auto rounded"></div>
        </div>
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>
              Enter your information below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirm Password
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Field>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
                )}
                <Field>
                  <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white">
                    {loading ? "Creating..." : "Create Account"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="border-2 border-teal-600 text-teal-700 hover:bg-teal-50"
                    onClick={() => {
                      window.location.href = `${BACKEND_URL}/api/v1/auth/google-auth`;
                    }}
                  >
                    Sign up with Google
                  </Button>
                  <FieldDescription className="text-center">
                    Already have an account?{" "}
                    <Link to="/signin" className="underline underline-offset-4 hover:text-primary">
                      Sign in
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Signup;
