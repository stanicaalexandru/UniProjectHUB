import { MigrationInterface, QueryRunner } from "typeorm";

// Activeaza RLS pe toate tabelele din schema public, fara politici. Aplicatia se conecteaza ca proprietarul
// tabelelor, pe care RLS nu il afecteaza; in schimb rolurile publice ale unei gazduiri de tip Supabase
// (anon, authenticated, folosite de API-ul REST generat automat) nu mai pot citi sau modifica nimic.
// Tabelele adaugate ulterior trebuie sa activeze RLS in propria migrare.
export class EnableRowLevelSecurity1790960000000 implements MigrationInterface {
    name = 'EnableRowLevelSecurity1790960000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE t record;
            BEGIN
                FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
                    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
                END LOOP;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE t record;
            BEGIN
                FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
                    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t.tablename);
                END LOOP;
            END $$;
        `);
    }

}
