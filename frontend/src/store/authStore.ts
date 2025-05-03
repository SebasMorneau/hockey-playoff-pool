import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import api from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

// Créer le store avec persistance
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,

      // Action de connexion
      login: (token: string, user: User) => {
        // Définir l'en-tête d'autorisation pour toutes les requêtes futures
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        set({
          user,
          token,
          isAuthenticated: true,
          isAdmin: user.isAdmin,
        });
      },

      // Action de déconnexion
      logout: () => {
        // Supprimer l'en-tête d'autorisation
        delete axios.defaults.headers.common["Authorization"];

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
        });
      },

      // Mettre à jour le profil utilisateur
      updateUser: (updatedUser: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
          isAdmin:
            updatedUser.isAdmin !== undefined
              ? updatedUser.isAdmin
              : state.isAdmin,
        }));
      },

      // Actualiser les données utilisateur
      refreshUser: async () => {
        try {
          const response = await api.auth.getCurrentUser();
          const { user } = response.data;
          set((state) => ({
            user,
            isAdmin: user.isAdmin,
            isAuthenticated: true,
            token: state.token,
          }));
        } catch (error) {
          // Si nous recevons une erreur 401, effacer l'état d'authentification
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isAdmin: false,
            });
            delete axios.defaults.headers.common["Authorization"];
          }
        }
      },
    }),
    {
      name: "hockey-pool-auth", // clé localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    },
  ),
);

// Initialiser axios avec le token s'il existe
if (typeof window !== "undefined") {
  const storedAuth = JSON.parse(
    localStorage.getItem("hockey-pool-auth") || "{}",
  );
  if (storedAuth.state?.token) {
    axios.defaults.headers.common["Authorization"] =
      `Bearer ${storedAuth.state.token}`;
    // Actualiser les données utilisateur à l'initialisation
    useAuthStore.getState().refreshUser();
  }
}

// Fonctions d'aide pour l'authentification
export const setupAxiosInterceptors = () => {
  // Intercepteur de réponse pour gérer les erreurs d'authentification
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // Gérer les erreurs 401 Non autorisé
      if (error.response?.status === 401) {
        // Rediriger uniquement si nous ne sommes pas déjà sur la page de connexion
        if (!window.location.pathname.includes("/login")) {
          useAuthStore.getState().logout();
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    },
  );
};
