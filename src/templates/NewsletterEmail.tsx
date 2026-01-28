import * as React from "react";
import {
    Html,
    Head,
    Body,
    Container,
    Text,
    Preview,
    Heading,
    Hr,
    Markdown,
    Link,
} from "@react-email/components";
import { Config } from "../config";

interface NewsletterEmailProps {
    name: string;
    email: string;
    content?: string;
    type?: 'update' | 'promotional' | 'security' | 'general';
    links?: { label: string; url: string }[];
}

export const NewsletterEmail = ({
    name,
    email,
    content = "We have some exciting updates for you! Stay tuned for more information about our launch.",
    type = 'update',
    links = [],
}: NewsletterEmailProps) => {
    const unsubscribeUrl = `${Config.FRONTEND_URL}/waitlist/unsubscribe?email=${encodeURIComponent(email)}`;
    
    const typeConfigs = {
        update: { label: 'Waitlist Update', color: '#00a3af' },
        promotional: { label: 'Special Announcement', color: '#f59e0b' },
        security: { label: 'Security Notification', color: '#ef4444' },
        general: { label: 'General Announcement', color: '#6366f1' },
    };

    const config = typeConfigs[type] || typeConfigs.update;

    return (
        <Html>
            <Head />
            <Preview>{config.label} for {name}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <div style={{ ...badge, backgroundColor: config.color }}>{config.label}</div>
                    <Heading style={h1}>Hello {name},</Heading>
                    <Markdown markdownContainerStyles={markdownStyles}>{content}</Markdown>
                    
                    {links && links.length > 0 && (
                        <div style={linksContainer}>
                            {links.map((link, idx) => (
                                <Link key={idx} href={link.url} style={button}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    <Hr style={hr} />
                    <Text style={footer}>
                        Best regards,<br />The BF Labs Team
                    </Text>
                    <Text style={footer}>
                        Visit us at <Link href={Config.FRONTEND_URL} style={link}>{Config.FRONTEND_URL}</Link>
                    </Text>
                    <Text style={subFooter}>
                        You are receiving this email because you signed up for our waitlist. 
                        You can <Link href={unsubscribeUrl} style={link}>unsubscribe</Link> at any time.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

const badge = {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase" as const,
    marginBottom: "16px",
};

const linksContainer = {
    marginTop: "24px",
    marginBottom: "24px",
    textAlign: "center" as const,
};

const button = {
    backgroundColor: "#00a3af",
    borderRadius: "5px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 24px",
    margin: "8px",
};

const link = {
    color: "#00a3af",
    textDecoration: "underline",
};

const subFooter = {
    fontSize: "12px",
    lineHeight: "22px",
    color: "#898989",
    marginTop: "12px",
};

const markdownStyles = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#333",
};

const main = {
    backgroundColor: "#ffffff",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
    maxWidth: "560px",
};

const h1 = {
    fontSize: "24px",
    fontWeight: "bold",
    margin: "40px 0",
    padding: "0",
    color: "#333",
};

const text = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#333",
};

const hr = {
    borderColor: "#cccccc",
    margin: "20px 0",
};

const footer = {
    color: "#8898aa",
    fontSize: "12px",
};

export default NewsletterEmail;
