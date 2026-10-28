import { getProjectMembers, type Workspace } from "@/types/board";

const admin = { id: "owner", name: "Admin", email: "", avatar: "", role: "admin" as const };
const invited = { id: "invited", name: "Convidada", email: "", avatar: "", role: "membro-admin" as const };
const workspace: Workspace = {
  id: "ws", name: "Equipe", description: "", invited: false, columns: [], tasks: [],
  members: [admin, invited],
  projects: [
    { id: "one", workspaceId: "ws", name: "Projeto um", description: "", visibility: "equipe", createdAt: "", members: [admin, invited] },
    { id: "two", workspaceId: "ws", name: "Projeto dois", description: "", visibility: "equipe", createdAt: "", members: [admin] },
    { id: "demo", workspaceId: "ws", name: "Antigo", description: "", visibility: "equipe", createdAt: "" }
  ]
};

describe("membros específicos por projeto", () => {
  it("não herda acesso de outro projeto do mesmo workspace", () => {
    expect(getProjectMembers(workspace, "one").map(person => person.id)).toEqual(["owner", "invited"]);
    expect(getProjectMembers(workspace, "two").map(person => person.id)).toEqual(["owner"]);
  });
  it("usa o fallback apenas para projetos antigos sem lista individual", () => {
    expect(getProjectMembers(workspace, "demo")).toEqual(workspace.members);
  });
  it("não expõe participantes de projetos inexistentes", () => {
    expect(getProjectMembers(workspace, "missing")).toEqual([]);
    expect(getProjectMembers(null, "one")).toEqual([]);
  });
});
