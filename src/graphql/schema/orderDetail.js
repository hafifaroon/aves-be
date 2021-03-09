module.exports = {
    types: `
        type OrderDetail{
            _id: ID!
            orderId: Order!
            deviceTypeId: DeviceType!
            quantity: Int!
            price: Int!
            createdAt: String!
            updatedAt: String!
            deletedAt: String
        }

        type OrderDetails{
            totalCount: Int!
            OrderDetails: [OrderDetail!]
        }

        type CheckDeleteOrderDetail{
            deleted: Boolean!
        }
    `
    ,
    queries: `
        OrderDetails(keyword: String, limit: Int, skip: Int): OrderDetails
        OrderDetail(_id: ID!): OrderDetail
        `
    ,
    mutations: `
        createOrderDetail(orderDetailInput: OrderDetailInput): OrderDetail
        updateOrderDetail(_id: ID!, updateOrderDetailInput: UpdateOrderDetailInput): OrderDetail
        deleteOrderDetail(_id: ID!): CheckDeleteOrderDetail
    `
    ,
    inputs: `
        input OrderDetailInput{
            quantity: String
            price: String
        }
        input UpdateOrderDetailInput{
            quantity: String
            price: String
        }
    `
};