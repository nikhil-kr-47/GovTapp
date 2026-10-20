import { error } from "console";

class ExpressError extends Error{
    constructor(status,msg){
      super(msg);
      this.status=status;
      this.messsage=msg;
    }
}

export default ExpressError;