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
} from "@react-email/components";

interface NewsletterEmailProps {
    name: string;
    content?: string;
}

export const NewsletterEmail = ({
    name,
    content = "We have some exciting updates for you! Stay tuned for more information about our launch.",
}: NewsletterEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Updates from the Waitlist</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Hello {name},</Heading>
                    <Text style={text}>{content}</Text>
                    <Hr style={hr} />
                    <Text style={footer}>
                        You are receiving this email because you signed up for our waitlist.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default NewsletterEmail;

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
