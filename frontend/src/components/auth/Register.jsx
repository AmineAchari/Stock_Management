import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/auth.service";

const Register = () => {
  const [nomUtilisateur, setNomUtilisateur] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const onChangeNomUtilisateur = (e) => {
    setNomUtilisateur(e.target.value);
  };

  const onChangeEmail = (e) => {
    setEmail(e.target.value);
  };

  const onChangeMotDePasse = (e) => {
    setMotDePasse(e.target.value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccessful(false);

    try {
      const response = await AuthService.register(
        nomUtilisateur,
        email,
        motDePasse
      );
      setMessage(response.data.message);
      setSuccessful(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      const resMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      setMessage(resMessage);
      setSuccessful(false);
    }
  };

  return (
    <div className="col-md-12">
      <div className="card card-container">
        <img
          src="//ssl.gstatic.com/accounts/ui/avatar_2x.png"
          alt="profile-img"
          className="profile-img-card"
        />

        <form onSubmit={handleRegister}>
          {!successful && (
            <div>
              <div className="form-group">
                <label htmlFor="nomUtilisateur">Nom d'utilisateur</label>
                <input
                  type="text"
                  className="form-control"
                  name="nomUtilisateur"
                  value={nomUtilisateur}
                  onChange={onChangeNomUtilisateur}
                  required
                  minLength="4"
                  maxLength="50"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={email}
                  onChange={onChangeEmail}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="motDePasse">Mot de passe</label>
                <input
                  type="password"
                  className="form-control"
                  name="motDePasse"
                  value={motDePasse}
                  onChange={onChangeMotDePasse}
                  required
                  minLength="8"
                />
                <small className="form-text text-muted">
                  Le mot de passe doit contenir au moins 8 caractères, incluant un chiffre, une lettre majuscule, une lettre minuscule et un caractère spécial.
                </small>
              </div>

              <div className="form-group">
                <button className="btn btn-primary btn-block">S'inscrire</button>
              </div>
            </div>
          )}

          {message && (
            <div className="form-group">
              <div
                className={
                  successful ? "alert alert-success" : "alert alert-danger"
                }
                role="alert"
              >
                {message}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;