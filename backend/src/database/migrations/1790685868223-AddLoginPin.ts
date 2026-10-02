import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLoginPin1790685868223 implements MigrationInterface {
    name = 'AddLoginPin1790685868223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "pin" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isPinEnabled" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isPinEnabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pin"`);
    }

}
