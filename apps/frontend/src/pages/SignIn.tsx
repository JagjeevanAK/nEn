import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { BACKEND_URL } from "@/config/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function SignIn({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError("")
      await axios.post(
        `${BACKEND_URL}/api/v1/auth/signin`,
        {
          email,
          password,
        },
        {
          withCredentials: true,
        }
      )
      navigate("/")
    } catch (err: unknown) {
      console.error("Sign in error:", err)
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Sign in failed")
      } else {
        setError("Sign in failed")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-teal-50 via-white to-blue-50">
      <div className={cn("flex flex-col gap-6 w-full max-w-md", className)} {...props}>
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">nEn</h1>
          <div className="h-1 w-16 bg-teal-600 mx-auto rounded"></div>
        </div>
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your email below to Sign in to your account
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
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
                )}
                <Field>
                  <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white">
                    {loading ? "Signging in..." : "Sign in"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="border-2 border-teal-600 text-teal-700 hover:bg-teal-50"
                    onClick={() => {
                      window.location.href = `${BACKEND_URL}/api/v1/auth/google-auth`;
                    }}
                  >
                    Sign in with Google
                  </Button>
                  <FieldDescription className="text-center">
                    Don&apos;t have an account?{" "}
                    <Link to="/signup" className="underline underline-offset-4 hover:text-primary">
                      Sign up
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
