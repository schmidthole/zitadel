export type Item = {
  name: string;
  slug: string;
  description?: string;
};

export const demos: { name: string; items: Item[] }[] = [
  {
    name: "Login",
    items: [
      {
        name: "Username",
        slug: "loginname",
        description: "Start the login flow with a username",
      },
      {
        name: "Accounts",
        slug: "accounts",
        description: "List active and inactive sessions",
      },
    ],
  },
  {
    name: "Register",
    items: [
      {
        name: "Register",
        slug: "register",
        description: "Add a user with password or passkey",
      },
      {
        name: "IDP Register",
        slug: "idp",
        description: "Add a user from an external identity provider",
      },
    ],
  },
];
