export type AppRole = "admin" | "colaborador";

export interface Profile {
  id: string;
  email: string;
  nome_completo: string | null;
  cpf: string | null;
  cargo: string | null;
  departamento: string | null;
  telefone: string | null;
  avatar_url: string | null;
  data_admissao: string | null;
}
