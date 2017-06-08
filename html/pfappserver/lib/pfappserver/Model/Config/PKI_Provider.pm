package pfappserver::Model::Config::PKI_Provider;

=head1 NAME

pfappserver::Model::Config::PKI_Provider

=head1 DESCRIPTION

pfappserver::Model::Config::PKI_Provider

The Config Model for PKI_Provider

=cut

use HTTP::Status qw(:constants is_error is_success);
use Moose;
use namespace::autoclean;
use pf::ConfigStore::PKI_Provider;
use pf::ConfigStore::Provisioning;
use pf::log;

extends 'pfappserver::Base::Model::Config';


has '+configStoreClass' => (default => 'pf::ConfigStore::PKI_Provider');

=head2 remove

Override the parent method to validate we don't remove a PKI provider that is used in a provisioner

=cut

sub remove {
    my ($self, $id) = @_;
    pf::log::get_logger->info("Deleting $id");
    my @results = map { 
        $_->search("pki_provider", $id, "id") 
    } $self->getModel("Config::Provisioning")->scopeChildConfigstores;
    if(@results){
        my @ids = map { $_->{id} } @results;
        my $csv = join(', ', @ids);
        my $status_msg = ["Cannot remove provider [_1] because it is still used by the following provisioners : [_2]",$id, $csv];
        my $status =  HTTP_PRECONDITION_FAILED;
        return ($status, $status_msg);
    }
    else {
        return $self->SUPER::remove($id);
    }
}

__PACKAGE__->meta->make_immutable;

=head1 COPYRIGHT

Copyright (C) 2005-2017 Inverse inc.

=head1 LICENSE

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301,
USA.

=cut

1;

