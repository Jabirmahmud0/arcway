import "dotenv/config";
import { eq, and } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import * as store from "../server/db";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../shared/demo";
process.env.RUNTIME_STATE_BACKEND = "postgres";
const { storagePut } = await import("../server/storage");
if (!process.env.CLERK_SECRET_KEY?.startsWith("sk_test_")) throw new Error("Use the portfolio Clerk development instance only.");
async function clerk(path: string, body?: unknown) {
 const r = await fetch(`https://api.clerk.com/v1/${path}`, {method:body ? "POST":"GET",headers:{Authorization:`Bearer ${process.env.CLERK_SECRET_KEY}`,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
 const data = await r.json(); if(!r.ok) throw new Error(`Clerk ${r.status}: ${JSON.stringify(data.errors?.map((e:any)=>e.message))}`); return data;
}
const db = (await store.getDb())!;
const accounts = [];
for (const account of DEMO_ACCOUNTS) {
 const found = await clerk(`users?email_address=${encodeURIComponent(account.email)}`);
 const profile = found[0] ?? await clerk("users", {email_address:[account.email],password:DEMO_PASSWORD,first_name:"Demo",last_name:account.role === "reviewer"?"Reviewer":"Trader",skip_password_checks:true});
 await store.upsertUser({openId:profile.id,name:`Demo ${account.role}`,email:account.email,role:account.role,loginMethod:"clerk"});
 accounts.push((await store.getUserByOpenId(profile.id))!);
}
const [reviewer,trader] = accounts;
const organizationId = reviewer.organizationId!;
await db.update(schema.organizations).set({name:"Arcway Recruiter Demo · Fictional Data"}).where(eq(schema.organizations.id,organizationId));
await db.update(schema.users).set({organizationId}).where(eq(schema.users.id,trader.id));
await db.insert(schema.memberships).values({organizationId,userId:trader.id,role:"trader"}).onConflictDoNothing();
function pdf(lines: string[]) {
 const stream = `BT /F1 10 Tf 40 750 Td 14 TL ${lines.map((s,i)=>`${i?'T* ':''}(${s.replace(/[()\\]/g,' ')}) Tj`).join(' ')} ET`;
 const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
 let text='%PDF-1.4\n';const offsets=[0]; objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(text));text+=`${i+1} 0 obj\n${o}\nendobj\n`;}); const xref=Buffer.byteLength(text);text+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`; return Buffer.from(text);
}
for (const [index, reference] of ['DEMO-COFFEE-001','DEMO-COFFEE-002','DEMO-COFFEE-003'].entries()) {
 if((await db.select().from(schema.trades).where(and(eq(schema.trades.reference,reference),eq(schema.trades.organizationId,organizationId)))).length) continue;
 const {tradeId}=await store.createShadowAuditTrade(trader.id);
 await db.update(schema.trades).set({reference}).where(eq(schema.trades.id,tradeId));
 const documents=await store.getTradeDocuments(tradeId);
 for(const document of documents.filter(d=>index===1 || d.status !== 'pending')) {
  const extracted = {...(document.extractedData as Record<string,unknown>),invoiceNumber:reference,issueDate:new Date().toISOString().slice(0,10)};
  if(index===1) Object.assign(extracted,{incoterm:'FOB',quantity:'24000',issues:[]});
  const fileName=`${reference}-${document.documentType.replace(/[^a-z]+/gi,'-')}.pdf`;
  const file=await storagePut(`demo/${fileName}`,pdf(['ARCWAY FICTIONAL DEMONSTRATION - NOT A REAL TRANSACTION',document.documentType.toUpperCase(),`Trade Reference: ${reference}`,...Object.entries(extracted).filter(([key])=>key!=='issues').map(([k,v])=>`${k}: ${v}`)]),'application/pdf');
  await store.updateDocumentUpload({documentId:document.id,userId:trader.id,fileName,fileKey:file.key,fileUrl:file.url,mimeType:'application/pdf',extractedData:extracted,inconsistencies:[]});
 }
 if(index===1) {
  await db.update(schema.tradeExceptions).set({status:'resolved'}).where(eq(schema.tradeExceptions.tradeId,tradeId));
  await db.update(schema.tradeObligations).set({status:'fulfilled'}).where(eq(schema.tradeObligations.tradeId,tradeId));
  for(const document of documents) await store.updateDocumentReview({documentId:document.id,reviewerId:reviewer.id,status:'verified',reviewerNotes:'Synthetic evidence reviewed for recruiter demonstration.'});
  await db.update(schema.trades).set({assuranceState:'approved',partyKycState:'verified'}).where(eq(schema.trades.id,tradeId));
 }
 if(index===2) await db.update(schema.trades).set({assuranceState:'draft'}).where(eq(schema.trades.id,tradeId));
 await store.createShipment({organizationId,tradeId,mode:'sea',carrier:'Demo Ocean Line',bookingReference:`BK-${reference}`,origin:'Santos, Brazil',destination:'Hamburg, Germany',etd:new Date(Date.now()+12*86400000),eta:new Date(Date.now()+32*86400000)});
 await store.createTradeTask({organizationId,tradeId,title:index===1?'Confirm release handoff':'Resolve quantity and Incoterm discrepancy',detail:'Demo exercise: inspect evidence, correct a document, and re-run preflight.',assigneeId:trader.id,createdBy:reviewer.id,deadline:new Date(Date.now()+86400000)});
 await store.ingestTradeEmail({tradeId,sender:'logistics@example.com',subject:`[SAMPLE] Booking update ${reference}`,body:'Fictional correspondence. Please confirm the cargo quantity and provide the certificate of origin before vessel cut-off.',ingestedBy:trader.id});
 await store.createPartnerRequest({tradeId,requestedBy:trader.id,recipientEmail:'partner@example.com',requestType:'certificate of origin',message:'Sample request only. No email was sent.',dueAt:new Date(Date.now()+3*86400000)});
 await db.insert(schema.paymentTerms).values({tradeId,method:'letter_of_credit',presentationDays:21,lcReference:`LC-${reference}`,dueDate:new Date(Date.now()+30*86400000)});
 await db.insert(schema.paymentRecords).values({tradeId,amount:'102000.00',currency:'USD',status:'expected'});
 await db.insert(schema.comments).values({tradeId,authorId:reviewer.id,body:'Recruiter walkthrough: compare invoice and packing list, inspect release blockers, and try a new document upload. All records here are fictional.'});
 await store.appendAuditRecord({organizationId,actorId:reviewer.id,action:'demo.scenario_created',objectType:'trade',objectId:String(tradeId),reason:'Fictional recruiter walkthrough'});
 console.log(`Seeded ${reference}`);
}
if(!(await store.listOrganizationMasters(organizationId)).counterparties.length) {
 await store.createCounterparty({organizationId,legalName:'Northstar Foods GmbH (Demo)',countryCode:'DE'});
 await store.createCounterparty({organizationId,legalName:'Meridian Export House LLC (Demo)',countryCode:'AE'});
 await store.createProduct({organizationId,sku:'DEMO-COFFEE-G1',description:'Grade 1 Arabica coffee beans',countryOfOrigin:'BR',hsClassification:'090111'});
 await store.createPolicyPack({organizationId,name:'Demo export evidence policy',scope:'company',ownerId:reviewer.id,rules:{requiredDocuments:['commercial invoice','packing list','certificate of origin']}});
}
console.log('Recruiter accounts and isolated sample workspace ready.');
process.exit(0);
