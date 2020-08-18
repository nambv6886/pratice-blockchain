import {sql, doQuery} from './mysql';
import {Utils} from '../utils';
import * as config from "config";

export const Address = {
    get: async (address: string, project_id?: number) => {
        let query = `select * from addresses where address = '${address}'`;
        if(project_id) {
            query+= ` and project_id = '${project_id}'`;
        }
        // logger.info("list_balance query", query);
        let [result, ignored]: any[] = await sql.query(query);
        return result.length ? result[0] : null;
    },

    get_by_user_id: async (user_id: number) => {
        let query = `select * from addresses where user_id = '${user_id}'`;
        // logger.info("list_balance query", query);
        let [result, ignored]: any[] = await sql.query(query);
        return result.length ? result[0] : null;
    },
    listByProjectId: async (symbol: string, project_id: number) => {
        let query = `select * from addresses where symbol = '${symbol}' and project_id = '${project_id}'`;
        // logger.info("list_balance query", query);
        let [result, ignored]: any[] = await sql.query(query);
        return result;
    },
    list: async (blockchain_id: number) => {
        let query = `select * from addresses where blockchain_id = '${blockchain_id}'`;
        // logger.info("list_balance query", query);
        let [result, ignored]: any[] = await sql.query(query);
        return result;
    },
    get_private_key: async (address: string) => {
        let address_obj = await Address.get(address);
        let decrypt_pass = address_obj.user_id + String(config.get('addressSecret'));
        return Utils.decrypt(address_obj.private_key, decrypt_pass);
    },
    create: async (data: any) => {
        let item: any = {
            user_id: data.user_id,
            address: data.address,
            private_key: data.private_key,
            project_id: data.project_id,
            blockchain_id: data.blockchain_id
        };
        return doQuery.insertRow('addresses', item);
    },
    list_all_by_project_id: async (data: any) => {
     try {
        let query = `select * from addresses where project_id = '${data.id}'`;
        let count_query = `select count(*) as total from addresses where project_id = '${data.id}'`
        if(data.search) {
            query += ` and address like '%${data.search}%'`;
            count_query += ` and address like '%${data.search}%'`;
        }

        const result = await doQuery.listRows(query, data);
        const [total, ignored] = await sql.query(count_query);
        return {
            data: result,
            ...total[0]
        };
     } catch (error) {
         console.log(2);
         
     }
    },
};
