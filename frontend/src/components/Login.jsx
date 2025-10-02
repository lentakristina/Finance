import React, { useState } from "react";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <Card className="shadow-sm rounded-4 border-0">
          <Card.Body className="p-5">
            <div className="text-center mb-5">
              <h1 className="fw-bold text-primary">FinTrack App</h1>
              <p className="text-muted mb-0">Sign in to your account</p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Button type="submit" className="w-100 py-2" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" /> Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </Form>

            <div className="text-center mt-4">
              <Link to="/register" className="text-primary">
                Don't have an account? Sign up
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Login;
