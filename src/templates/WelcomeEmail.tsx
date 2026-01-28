import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
    Link,
    Hr,
} from "@react-email/components";
import * as React from "react";
import { Config } from "../config";

interface WelcomeEmailProps {
    name: string;
    email: string;
}

export const WelcomeEmail = ({ name, email }: WelcomeEmailProps) => {
    const unsubscribeUrl = `${Config.FRONTEND_URL}/waitlist/unsubscribe?email=${encodeURIComponent(email)}`;
    
    return (
        <Html>
            <Head />
            <Preview>Welcome to the Waitlist!</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Welcome, {name}!</Heading>
                    <Text style={text}>
                        Thanks for joining our waitlist. We're excited to have you on board.
                    </Text>
                    <Text style={text}>
                        We'll keep you posted on our progress and let you know as soon as we're
                        ready to launch.
                    </Text>
                    <Hr style={hr} />
                    <Text style={footer}>
                        Best regards,<br />The BF Labs Team
                    </Text>
                    <Text style={footer}>
                        Visit us at <Link href={Config.FRONTEND_URL} style={link}>{Config.FRONTEND_URL}</Link>
                    </Text>
                    <Text style={subFooter}>
                        You can <Link href={unsubscribeUrl} style={link}>unsubscribe</Link> at any time if you no longer wish to receive updates.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
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

const hr = {
    borderColor: "#cccccc",
    margin: "20px 0",
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

const footer = {
    fontSize: "14px",
    lineHeight: "24px",
    color: "#898989",
    marginTop: "24px",
};

export default WelcomeEmail;
