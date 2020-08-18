import {sql, doQuery} from './mysql';

export const Currency = {
    get: async (symbol: string) => {
        let query = `select * from currencies where symbol = '${symbol}'`;
        // logger.info("list_balance query", query);
        let [result, ignored]: any[] = await sql.query(query);
        return result.length ? result[0] : null;
    },
    get_by_id: async (id: number) => {
        let query = `select * from currencies where id = '${id}'`;
        // logger.info("list_balance query", query);
        let [result, ignored]: any[] = await sql.query(query);
        return result.length ? result[0] : null; 
    },
    list: async () => {
        let query = `select * from currencies where activate = 1`;
        // logger.info("list_balance query", query);
        let [result, ignored]: any[] = await sql.query(query);
        return result;
    },
    list_tokens: async () => {
        let query = `select * from currencies where is_token = 1`;
        // logger.info("list_balance query", query);
        let [result, ignored]: any[] = await sql.query(query);
        return result;
    },
    create: async (data: any) => {
        let item: any = {
            symbol: data.project_symbol,
            name: data.name ,
            blockchain_symbol: data.blockchain_symbol,
            decimal: data.decimal,
            is_token: data.is_token,
            token_adddess: data.token_adddess,
            activate: 1,
            minimum_threshold:data.minimum_threshold,
            minimum_deposit:data.minimum_deposit
        };
        return doQuery.insertRow('currencies', item);
    },
};
