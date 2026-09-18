import os
from ftplib import FTP

def upload_file_to_ftp(file_path, remote_file_name, ftp_host=None, ftp_user=None, ftp_password=None):
    ftp_host = ftp_host or os.environ["FTP_HOST"]
    ftp_user = ftp_user or os.environ["FTP_USER"]
    ftp_password = ftp_password or os.environ["FTP_PASSWORD"]
    try:
        # Connect to the FTP server
        ftp = FTP(ftp_host)
        ftp.login(user=ftp_user, passwd=ftp_password)

        print(f"Connected to FTP server: {ftp_host}")

        ftp.cwd('/_encrypt/_세한아카데미') 

        # Open the file in binary mode
        with open(file_path, 'rb') as file:
            # Upload the file
            ftp.storbinary(f'STOR {remote_file_name}', file)
            print(f"Successfully uploaded {file_path} to {remote_file_name}")


        # Close the connection
        ftp.quit()
        print("FTP connection closed.")
    
    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
file_path = '2024-12-06_12_Economics_강승재.mp4'  # Replace with the path to your file
remote_file_name = '2024-12-06_12_Economics_강승재.mp4'  # The name you want to give the file on the FTP server

if __name__ == '__main__':
    upload_file_to_ftp(file_path, remote_file_name)
