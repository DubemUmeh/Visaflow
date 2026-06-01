```typescript
[Nest] 24528  - 28/05/2026, 4:06:51 pm     LOG [HTTP] POST /api/v1/auth/login 200 +2085ms [a2cef91e-7b8b-41bf-a7ae-12
f47708b280]
[Nest] 24528  - 28/05/2026, 4:06:54 pm    WARN [AllExceptionsFilter] GET /api/v1/applications?limit=5 404: "Cannot GE
T /api/v1/applications?limit=5"
[Nest] 24528  - 28/05/2026, 4:06:55 pm    WARN [AllExceptionsFilter] GET /api/v1/applications?limit=5 404: "Cannot GE
T /api/v1/applications?limit=5"
[Nest] 24528  - 28/05/2026, 4:06:56 pm    WARN [HTTP] GET /api/v1/users/me ERROR +1010ms [bbcf75a8-1da1-4a2e-acdb-9d5
a80c74e04]
[Nest] 24528  - 28/05/2026, 4:06:56 pm   ERROR [AllExceptionsFilter] Failed query: select "id", "email", "email_verif
ied", "phone", "phone_verified", "role", "first_name", "last_name", "avatar_url", "date_of_birth", "nationality", "pa
ssport_number", "preferred_locale", "timezone", "is_active", "is_banned", "two_factor_enabled", "last_login_at", "cre
ated_at", "updated_at" from "users" where ("users"."id" = $1 and "users"."deleted_at" is null) limit $2
params: me,1
Error: Failed query: select "id", "email", "email_verified", "phone", "phone_verified", "role", "first_name", "last_n
ame", "avatar_url", "date_of_birth", "nationality", "passport_number", "preferred_locale", "timezone", "is_active", "
is_banned", "two_factor_enabled", "last_login_at", "created_at", "updated_at" from "users" where ("users"."id" = $1 a
nd "users"."deleted_at" is null) limit $2
params: me,1
    at PostgresJsPreparedQuery.queryWithCache (D:\Dubem F\My Portfolio\PROJECTS\visaflow\node_modules\.pnpm\drizzle-o
rm@0.45.2_pg@8.21.0_postgres@3.4.9\node_modules\src\pg-core\session.ts:73:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async <anonymous> (D:\Dubem F\My Portfolio\PROJECTS\visaflow\node_modules\.pnpm\drizzle-orm@0.45.2_pg@8.21.0_p
ostgres@3.4.9\node_modules\src\postgres-js\session.ts:58:17)
    at async UsersService.findById (D:\Dubem F\My Portfolio\PROJECTS\visaflow\apps\api\src\users\users.service.ts:53:
18)
[Nest] 24528  - 28/05/2026, 4:06:56 pm   ERROR [AllExceptionsFilter] GET /api/v1/users/me 500
Error: Failed query: select "id", "email", "email_verified", "phone", "phone_verified", "role", "first_name", "last_n
ame", "avatar_url", "date_of_birth", "nationality", "passport_number", "preferred_locale", "timezone", "is_active", "
is_banned", "two_factor_enabled", "last_login_at", "created_at", "updated_at" from "users" where ("users"."id" = $1 a
nd "users"."deleted_at" is null) limit $2
params: me,1
    at PostgresJsPreparedQuery.queryWithCache (D:\Dubem F\My Portfolio\PROJECTS\visaflow\node_modules\.pnpm\drizzle-o
rm@0.45.2_pg@8.21.0_postgres@3.4.9\node_modules\src\pg-core\session.ts:73:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async <anonymous> (D:\Dubem F\My Portfolio\PROJECTS\visaflow\node_modules\.pnpm\drizzle-orm@0.45.2_pg@8.21.0_p
ostgres@3.4.9\node_modules\src\postgres-js\session.ts:58:17)
    at async UsersService.findById (D:\Dubem F\My Portfolio\PROJECTS\visaflow\apps\api\src\users\users.service.ts:53:
18)
[Nest] 24528  - 28/05/2026, 4:06:57 pm    WARN [HTTP] GET /api/v1/users/me ERROR +10ms [f4dfd3e7-5204-4823-a6ee-e2a9f
7d14481]
[Nest] 24528  - 28/05/2026, 4:06:57 pm   ERROR [AllExceptionsFilter] Failed query: select "id", "email", "email_verif
ied", "phone", "phone_verified", "role", "first_name", "last_name", "avatar_url", "date_of_birth", "nationality", "pa
ssport_number", "preferred_locale", "timezone", "is_active", "is_banned", "two_factor_enabled", "last_login_at", "cre
ated_at", "updated_at" from "users" where ("users"."id" = $1 and "users"."deleted_at" is null) limit $2
params: me,1
Error: Failed query: select "id", "email", "email_verified", "phone", "phone_verified", "role", "first_name", "last_n
ame", "avatar_url", "date_of_birth", "nationality", "passport_number", "preferred_locale", "timezone", "is_active", "
is_banned", "two_factor_enabled", "last_login_at", "created_at", "updated_at" from "users" where ("users"."id" = $1 a
nd "users"."deleted_at" is null) limit $2
params: me,1
    at PostgresJsPreparedQuery.queryWithCache (D:\Dubem F\My Portfolio\PROJECTS\visaflow\node_modules\.pnpm\drizzle-o
rm@0.45.2_pg@8.21.0_postgres@3.4.9\node_modules\src\pg-core\session.ts:73:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async <anonymous> (D:\Dubem F\My Portfolio\PROJECTS\visaflow\node_modules\.pnpm\drizzle-orm@0.45.2_pg@8.21.0_p
ostgres@3.4.9\node_modules\src\postgres-js\session.ts:58:17)
    at async UsersService.findById (D:\Dubem F\My Portfolio\PROJECTS\visaflow\apps\api\src\users\users.service.ts:53:
18)
[Nest] 24528  - 28/05/2026, 4:06:57 pm   ERROR [AllExceptionsFilter] GET /api/v1/users/me 500
Error: Failed query: select "id", "email", "email_verified", "phone", "phone_verified", "role", "first_name", "last_n
ame", "avatar_url", "date_of_birth", "nationality", "passport_number", "preferred_locale", "timezone", "is_active", "
is_banned", "two_factor_enabled", "last_login_at", "created_at", "updated_at" from "users" where ("users"."id" = $1 a
nd "users"."deleted_at" is null) limit $2
params: me,1
    at PostgresJsPreparedQuery.queryWithCache (D:\Dubem F\My Portfolio\PROJECTS\visaflow\node_modules\.pnpm\drizzle-o
rm@0.45.2_pg@8.21.0_postgres@3.4.9\node_modules\src\pg-core\session.ts:73:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async <anonymous> (D:\Dubem F\My Portfolio\PROJECTS\visaflow\node_modules\.pnpm\drizzle-orm@0.45.2_pg@8.21.0_p
ostgres@3.4.9\node_modules\src\postgres-js\session.ts:58:17)
    at async UsersService.findById (D:\Dubem F\My Portfolio\PROJECTS\visaflow\apps\api\src\users\users.service.ts:53:
18)
```

```error
this error happened when i tried to start an application.
another error is when i refresh the page, I got logged out and i do not know if it is becasue there is no proxy.st at the @visaflow/web for. also why is the auth stored in localstorage instaed of session storage, plus i it stored user's data fetched from the database (firstname, lastname, id, refresh and access token, emeail verfied or not, i mean the whole of user's table from the db) instead of storing the access token and refresh token
```

```error
Another error is at the @webflow/web via
(File path)[apps\web\components\application\step-select-visa.tsx] arond line 71
when i tried to create an application, ig got error that country.filer is not a function
```

also make the whole frontend Ui to FEAUTURE the smooth and sleek of  og the snippet folder Ui, and create neccessary pages reqired like terms, privacy, dashbaord/ SUPPOrt,explore,notigiction. api docs,blog,aboUt,press,contact,statUs,Track,cookies,refUnds. and remeber all Ui featUting the snippets design interfaces