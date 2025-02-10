const axios = require('axios');
const config = require("../config");

// Push notificatiin type
const notificationTypeFollowers = "followers";
const notificationTypeLikedPost = "postLiked";
const notificationTypeCommentPost = "postComment";
const notificationTypeLiveInvite = "live";
const notificationTypeVisitor = "visitor";
const notificationTypeSpecial = "special";
const notificationTypeChat = "chat";
const notificationTypePostGift = "giftPost";
const notificationTypePerofileGift = "giftProfile";
const notificationTypeSendItem = "obtainedItem";
const notificationTypePostMention = "mention";

const notificationTypePayrollOrderNew = "payrollOrderNew";
const notificationTypePayrollOrderPaymentSent = "payrollOrderPaymentSent";
const notificationTypePayrollOrderPaymentReceived = "payrollOrderPayReceived";
const notificationTypePayrollOrderPaymentProblem = "payrollOrderProblem";
const notificationTypePayrollOrderPaymentProblemUpdated = "payrollOrderProblemUpdate";


async function sendOneSignalPush(type, customData, target_ids) {

    var pushTemplate;

    if(type === notificationTypeFollowers){
        pushTemplate = config.pushTemplateFollow;

    } else if(type === notificationTypeLikedPost){
        pushTemplate = config.pushTemplatePostLike;

    } else if(type === notificationTypeCommentPost){
        pushTemplate = config.pushTemplatePostComment;
        
    } else if(type === notificationTypePostGift || type === notificationTypePerofileGift){
        pushTemplate = config.pushTemplateGift;
        
    } else if(type === notificationTypeLiveInvite){
        pushTemplate = config.pushTemplateLive;
        
    } else if(type === notificationTypeVisitor){
        pushTemplate = config.pushTemplateVisitor;
        
    } else if(type === notificationTypeSpecial){
        pushTemplate = config.pushTemplateSpecial;
        
    } else if(type === notificationTypeChat){
        pushTemplate = config.pushTemplateChat;
        
    } else if(type === notificationTypeSendItem){
        pushTemplate = config.pushTemplateObjtainedItem;
        
    } else if(type === notificationTypePostMention){
        pushTemplate = config.pushTemplatePostMenstion;
        
    } else if(type === notificationTypePayrollOrderNew){
        pushTemplate = config.pushTemplatePayrollOrderNew;
        
    } else if(type === notificationTypePayrollOrderPaymentSent){
        pushTemplate = config.pushTemplatePayrollOrderPaymentSent;
        
    } else if(type === notificationTypePayrollOrderPaymentReceived){
        pushTemplate = config.pushTemplatePayrollOrderPaymentReceived;
        
    } else if(type === notificationTypePayrollOrderPaymentProblem){
        pushTemplate = config.pushTemplatePayrollOrderPaymentProblem;
        
    } else if(type === notificationTypePayrollOrderPaymentProblemUpdated){
        pushTemplate = config.pushTemplatePayrollOrderPaymentProblemUpdated;
        
    } 

    const options = {
        method: 'POST',
        url: "https://onesignal.com/api/v1/notifications",
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'Authorization': 'Basic ' + config.one_s_rest_api_key
        },
        data: {
            app_id: config.one_s_app_id,
            include_aliases: {external_id: target_ids},
            target_channel: "push",
            template_id : pushTemplate,
            custom_data: customData,
            data: customData,
        }
    };

    try {
        const response = await axios.request(options);
        console.info("OneSignal Push sent", response.data);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error("One Signal Push got an error response", error.response.status, error.response.statusText, error.response.data);
        } else {
            console.error("One Signal Push error", error.message);
        }
        return error;
    }
}

module.exports = sendOneSignalPush;